<?php

namespace Pterodactyl\Http\Controllers\Admin\Settings;

use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\View\Factory as ViewFactory;
use Illuminate\Support\Facades\Storage;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Traits\Helpers\AvailableLanguages;
use Pterodactyl\Services\Helpers\SoftwareVersionService;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Settings\BaseSettingsFormRequest;

class IndexController extends Controller
{
    use AvailableLanguages;

    /**
     * IndexController constructor.
     */
    public function __construct(
        private AlertsMessageBag $alert,
        private Kernel $kernel,
        private SettingsRepositoryInterface $settings,
        private SoftwareVersionService $versionService,
        private ViewFactory $view
    ) {
    }

    /**
     * Render the UI for basic Panel settings.
     */
    public function index(): View
    {
        return $this->view->make('admin.settings.index', [
            'version' => $this->versionService,
            'languages' => $this->getAvailableLanguages(true),
        ]);
    }

    /**
     * Handle settings update.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update(BaseSettingsFormRequest $request): RedirectResponse
    {
        $data = $request->normalize();
        
        // Handle logo file upload
        if ($request->hasFile('logo_file')) {
            try {
                // Delete old uploaded logo if exists
                $currentLogo = $this->settings->get('settings::app:logo');
                if ($currentLogo && str_starts_with($currentLogo, '/storage/logos/')) {
                    $oldLogoPath = str_replace('/storage/', '', $currentLogo);
                    Storage::disk('public')->delete($oldLogoPath);
                }
                
                // Store new logo
                $logoFile = $request->file('logo_file');
                $filename = 'logo_' . time() . '.' . $logoFile->getClientOriginalExtension();
                $logoPath = $logoFile->storeAs('logos', $filename, 'public');
                $data['app:logo'] = '/storage/' . $logoPath;
                
                // Log for debugging
                \Log::info('Logo uploaded successfully', [
                    'path' => $logoPath,
                    'url' => '/storage/' . $logoPath,
                    'file_exists' => Storage::disk('public')->exists($logoPath)
                ]);
                
            } catch (\Exception $e) {
                \Log::error('Logo upload failed', ['error' => $e->getMessage()]);
                $this->alert->danger('Failed to upload logo: ' . $e->getMessage())->flash();
                return redirect()->back()->withInput();
            }
        }
        
        foreach ($data as $key => $value) {
            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');
        $this->alert->success('Panel settings have been updated successfully and the queue worker was restarted to apply these changes.')->flash();

        return redirect()->route('admin.settings');
    }
}
