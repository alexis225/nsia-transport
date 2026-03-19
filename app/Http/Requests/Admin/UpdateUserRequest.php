<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * UpdateUserRequest — US-007
 */
class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name'  => ['required', 'string', 'max:100'],
            'email'      => ['required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'phone'      => ['nullable', 'string', 'max:30'],
            'role'       => ['nullable', 'string', 'exists:roles,name'],
        ];
    }
}