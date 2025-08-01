<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Illuminate\Validation\Rule;
use Pterodactyl\Traits\Helpers\AvailableLanguages;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class BaseSettingsFormRequest extends AdminFormRequest
{
    use AvailableLanguages;

    public function rules(): array
    {
        return [
            'app:name' => 'required|string|max:191',
            'app:logo' => 'nullable|url|max:500',
            'app:logo_size' => 'nullable|integer|min:16|max:100',
            'logo_file' => 'nullable|image|mimes:png,jpg,jpeg,svg,webp|max:2048',
            'pterodactyl:auth:2fa_required' => 'required|integer|in:0,1,2',
            'app:locale' => ['required', 'string', Rule::in(array_keys($this->getAvailableLanguages()))],
            'theme:primary_color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'theme:secondary_color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'theme:card_style' => 'nullable|string|in:gradient,solid,glassmorphism',
            'theme:border_radius' => 'nullable|integer|min:0|max:24',
            'theme:animation_speed' => 'nullable|string|in:fast,normal,slow',
            'theme:text_contrast' => 'nullable|integer|min:0|max:100',
            'theme:custom_css' => 'nullable|string|max:10000',
        ];
    }

    public function attributes(): array
    {
        return [
            'app:name' => 'Company Name',
            'app:logo' => 'Company Logo URL',
            'app:logo_size' => 'Logo Size',
            'logo_file' => 'Company Logo File',
            'pterodactyl:auth:2fa_required' => 'Require 2-Factor Authentication',
            'app:locale' => 'Default Language',
            'theme:primary_color' => 'Primary Theme Color',
            'theme:secondary_color' => 'Secondary Theme Color',
            'theme:card_style' => 'Card Background Style',
            'theme:border_radius' => 'Card Border Radius',
            'theme:animation_speed' => 'Animation Speed',
            'theme:text_contrast' => 'Text Contrast',
            'theme:custom_css' => 'Custom CSS',
        ];
    }
}
