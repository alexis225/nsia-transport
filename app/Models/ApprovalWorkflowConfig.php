<?php

namespace App\Models;
 
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalWorkflowConfig extends Model
{
    protected $table    = 'approval_workflows';
    use HasUuids;
 
    protected $fillable = [
        'tenant_id', 'name', 'entity_type',
        'trigger_condition', 'steps_config', 'is_active',
    ];
 
    protected $casts = [
        'trigger_condition' => 'array',
        'steps_config'      => 'array',
        'is_active'         => 'boolean',
    ];
 
    const ENTITY_CERTIFICATE = 'CERTIFICATE';
    const ENTITY_CONTRACT    = 'CONTRACT';
 
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
 
    public function requests(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class, 'workflow_id');
    }
 
    /**
     * Trouve le workflow actif applicable à un certificat
     */
    public static function findForCertificate(
        Certificate $certificate,
        InsuranceContract $contract
    ): ?self {
        return static::where('tenant_id', $certificate->tenant_id)
            ->where('entity_type', self::ENTITY_CERTIFICATE)
            ->where('is_active', true)
            ->get()
            ->first(function (self $workflow) use ($certificate, $contract) {
                return static::evaluateCondition(
                    $workflow->trigger_condition,
                    $certificate,
                    $contract
                );
            });
    }
 
    /**
     * Évalue la trigger_condition JSON contre le certificat
     */
    public static function evaluateCondition(
        ?array $condition,
        Certificate $certificate,
        InsuranceContract $contract
    ): bool {
        // NULL = toujours déclenché
        if (empty($condition)) return true;
 
        // Condition : % de la valeur du contrat
        if (isset($condition['insured_value_pct_of_contract'])) {
            $contractValue = (float) $contract->insured_value;
            if ($contractValue <= 0) return false;
 
            $pct = ((float) $certificate->insured_value / $contractValue) * 100;
 
            foreach ($condition['insured_value_pct_of_contract'] as $op => $threshold) {
                // Utiliser le seuil du contrat si défini, sinon celui du workflow
                $effectiveThreshold = $contract->escalade_threshold_pct ?? $threshold;
                $result = match ($op) {
                    '>'  => $pct > $effectiveThreshold,
                    '>=' => $pct >= $effectiveThreshold,
                    '<'  => $pct < $effectiveThreshold,
                    '<=' => $pct <= $effectiveThreshold,
                    default => false,
                };
                if (! $result) return false;
            }
        }
 
        // Condition : valeur absolue
        if (isset($condition['insured_value'])) {
            $value = (float) $certificate->insured_value;
            foreach ($condition['insured_value'] as $op => $threshold) {
                $result = match ($op) {
                    '>'  => $value > $threshold,
                    '>=' => $value >= $threshold,
                    '<'  => $value < $threshold,
                    '<=' => $value <= $threshold,
                    default => false,
                };
                if (! $result) return false;
            }
        }
 
        return true;
    }
 
    /**
     * Retourne le step config pour un numéro de step donné
     */
    public function getStep(int $step): ?array
    {
        return collect($this->steps_config)
            ->firstWhere('step', $step);
    }
 
    /**
     * Nombre total d'étapes
     */
    public function totalSteps(): int
    {
        return count($this->steps_config ?? []);
    }
}