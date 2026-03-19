<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * StoreUserRequest — US-007
 */
class StoreUserRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name'  => ['required', 'string', 'max:100'],
            'email'      => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone'      => ['nullable', 'string', 'max:30'],
            'role'       => ['required', 'string', 'exists:roles,name'],
            'tenant_id'  => ['nullable', 'uuid', 'exists:tenants,id'],
            'password'   => ['required', 'confirmed', Password::min(8)
                ->mixedCase()->numbers()->symbols()],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'Le prénom est obligatoire.',
            'last_name.required'  => 'Le nom est obligatoire.',
            'email.required'      => 'L\'email est obligatoire.',
            'email.unique'        => 'Cet email est déjà utilisé.',
            'role.required'       => 'Le rôle est obligatoire.',
            'password.required'   => 'Le mot de passe est obligatoire.',
        ];
    }
}