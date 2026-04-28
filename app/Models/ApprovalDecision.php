<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalDecision extends Model
{
    use HasUuids;
 
    public $timestamps = false;
 
    protected $fillable = [
        'request_id', 'step_number', 'approver_id',
        'decision', 'comment', 'decided_at',
    ];
 
    protected $casts = [
        'decided_at' => 'datetime',
    ];
 
    const DECISION_APPROVED  = 'APPROVED';
    const DECISION_REJECTED  = 'REJECTED';
    const DECISION_DELEGATED = 'DELEGATED';
 
    public function request(): BelongsTo
    {
        return $this->belongsTo(ApprovalRequest::class, 'request_id');
    }
 
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}