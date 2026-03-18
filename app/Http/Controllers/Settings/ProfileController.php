<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\AuditLog;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    private const AVATAR_DISK   = 'public';
    private const AVATAR_FOLDER = 'avatars';
    private const AVATAR_MAX_KB = 2048;

    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status'          => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return to_route('profile.edit');
    }

    /**
     * Upload / remplacer l'avatar — US-009
     */
    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => [
                'required',
                'file',
                'image',
                'mimes:jpeg,png,webp',
                'max:' . self::AVATAR_MAX_KB,
            ],
        ], [
            'avatar.required' => 'Veuillez sélectionner une image.',
            'avatar.image'    => 'Le fichier doit être une image.',
            'avatar.mimes'    => 'Formats acceptés : JPG, PNG, WebP.',
            'avatar.max'      => 'La taille maximale est de 2 Mo.',
        ]);

        $user = $request->user();

        // Supprimer l'ancien avatar
        if ($user->avatar_path && Storage::disk(self::AVATAR_DISK)->exists($user->avatar_path)) {
            Storage::disk(self::AVATAR_DISK)->delete($user->avatar_path);
        }

        // Stocker le nouvel avatar
        $path = $request->file('avatar')->store(self::AVATAR_FOLDER, self::AVATAR_DISK);

        $user->update(['avatar_path' => $path]);

        $this->auditLog($request, 'avatar_updated');

        return back()->with('status', 'Photo de profil mise à jour.');
    }

    /**
     * Supprimer l'avatar — US-009
     */
    public function removeAvatar(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->avatar_path && Storage::disk(self::AVATAR_DISK)->exists($user->avatar_path)) {
            Storage::disk(self::AVATAR_DISK)->delete($user->avatar_path);
        }

        $user->update(['avatar_path' => null]);

        $this->auditLog($request, 'avatar_removed');

        return back()->with('status', 'Photo de profil supprimée.');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();
        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * Audit log helper.
     */
    private function auditLog(Request $request, string $action): void
    {
        AuditLog::create([
            'tenant_id'   => $request->user()->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => $action,
            'entity_type' => 'user',
            'entity_id'   => $request->user()->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
        ]);
    }
}