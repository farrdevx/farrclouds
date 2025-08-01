@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'basic'])

@section('title')
    Settings
@endsection

@section('content-header')
    <h1>Panel Settings<small>Configure Pterodactyl to your liking.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Settings</li>
    </ol>
@endsection

@section('content')
    @yield('settings::nav')
    <div class="row">
        <div class="col-xs-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">Panel Settings</h3>
                </div>
                <form action="{{ route('admin.settings') }}" method="POST" enctype="multipart/form-data">
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label class="control-label">Company Name</label>
                                <div>
                                    <input type="text" class="form-control" name="app:name" value="{{ old('app:name', config('app.name')) }}" />
                                    <p class="text-muted"><small>This is the name that is used throughout the panel and in emails sent to clients.</small></p>
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">Company Logo</label>
                                <div>
                                    <input type="file" class="form-control" name="logo_file" accept="image/*" />
                                    <p class="text-muted"><small>Upload your company logo (PNG, JPG, SVG). Max size: 2MB.</small></p>
                                    @if(config('app.logo'))
                                        <div style="margin-top: 10px;">
                                            <img src="{{ config('app.logo') }}" alt="Current Logo" style="max-height: 50px; max-width: 200px;" />
                                            <p class="text-muted"><small>Current logo</small></p>
                                        </div>
                                    @endif
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">Logo Size (Height in pixels)</label>
                                <div>
                                    <input type="number" class="form-control" name="app:logo_size" value="{{ old('app:logo_size', config('app.logo_size', 32)) }}" min="16" max="100" placeholder="32" />
                                    <p class="text-muted"><small>Set the height of the logo in the navigation bar (16-100px).</small></p>
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">Require 2-Factor Authentication</label>
                                <div>
                                    <div class="btn-group" data-toggle="buttons">
                                        @php
                                            $level = old('pterodactyl:auth:2fa_required', config('pterodactyl.auth.2fa_required'));
                                        @endphp
                                        <label class="btn btn-primary @if ($level == 0) active @endif">
                                            <input type="radio" name="pterodactyl:auth:2fa_required" autocomplete="off" value="0" @if ($level == 0) checked @endif> Not Required
                                        </label>
                                        <label class="btn btn-primary @if ($level == 1) active @endif">
                                            <input type="radio" name="pterodactyl:auth:2fa_required" autocomplete="off" value="1" @if ($level == 1) checked @endif> Admin Only
                                        </label>
                                        <label class="btn btn-primary @if ($level == 2) active @endif">
                                            <input type="radio" name="pterodactyl:auth:2fa_required" autocomplete="off" value="2" @if ($level == 2) checked @endif> All Users
                                        </label>
                                    </div>
                                    <p class="text-muted"><small>If enabled, any account falling into the selected grouping will be required to have 2-Factor authentication enabled to use the Panel.</small></p>
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">Default Language</label>
                                <div>
                                    <select name="app:locale" class="form-control">
                                        @foreach($languages as $key => $value)
                                            <option value="{{ $key }}" @if(config('app.locale') === $key) selected @endif>{{ $value }}</option>
                                        @endforeach
                                    </select>
                                    <p class="text-muted"><small>The default language to use when rendering UI components.</small></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="box-footer">
                        {!! csrf_field() !!}
                        <button type="submit" name="_method" value="PATCH" class="btn btn-sm btn-primary pull-right">Save</button>
                    </div>
                </form>
            </div>

            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">Theme Customization</h3>
                </div>
                <form action="{{ route('admin.settings') }}" method="POST">
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label class="control-label">Primary Theme Color</label>
                                <div>
                                    <input type="color" class="form-control" name="theme:primary_color" value="{{ old('theme:primary_color', config('theme.primary_color', '#8b5cf6')) }}" />
                                    <p class="text-muted"><small>Main theme color used throughout the interface.</small></p>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">Secondary Theme Color</label>
                                <div>
                                    <input type="color" class="form-control" name="theme:secondary_color" value="{{ old('theme:secondary_color', config('theme.secondary_color', '#7c3aed')) }}" />
                                    <p class="text-muted"><small>Secondary color for accents and highlights.</small></p>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label class="control-label">Card Background Style</label>
                                <div>
                                    <select class="form-control" name="theme:card_style">
                                        <option value="gradient" {{ old('theme:card_style', config('theme.card_style', 'gradient')) == 'gradient' ? 'selected' : '' }}>Gradient</option>
                                        <option value="solid" {{ old('theme:card_style', config('theme.card_style', 'gradient')) == 'solid' ? 'selected' : '' }}>Solid Color</option>
                                        <option value="glassmorphism" {{ old('theme:card_style', config('theme.card_style', 'gradient')) == 'glassmorphism' ? 'selected' : '' }}>Glassmorphism</option>
                                    </select>
                                    <p class="text-muted"><small>Choose the visual style for server cards.</small></p>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">Card Border Radius</label>
                                <div>
                                    <input type="range" class="form-control" name="theme:border_radius" min="0" max="24" value="{{ old('theme:border_radius', config('theme.border_radius', 16)) }}" oninput="this.nextElementSibling.value = this.value + 'px'">
                                    <output>{{ old('theme:border_radius', config('theme.border_radius', 16)) }}px</output>
                                    <p class="text-muted"><small>Adjust the roundness of card corners.</small></p>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label class="control-label">Animation Speed</label>
                                <div>
                                    <select class="form-control" name="theme:animation_speed">
                                        <option value="fast" {{ old('theme:animation_speed', config('theme.animation_speed', 'normal')) == 'fast' ? 'selected' : '' }}>Fast (200ms)</option>
                                        <option value="normal" {{ old('theme:animation_speed', config('theme.animation_speed', 'normal')) == 'normal' ? 'selected' : '' }}>Normal (300ms)</option>
                                        <option value="slow" {{ old('theme:animation_speed', config('theme.animation_speed', 'normal')) == 'slow' ? 'selected' : '' }}>Slow (500ms)</option>
                                    </select>
                                    <p class="text-muted"><small>Control the speed of hover animations.</small></p>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">Text Contrast</label>
                                <div>
                                    <input type="range" class="form-control" name="theme:text_contrast" min="0" max="100" value="{{ old('theme:text_contrast', config('theme.text_contrast', 80)) }}" oninput="this.nextElementSibling.value = this.value + '%'">
                                    <output>{{ old('theme:text_contrast', config('theme.text_contrast', 80)) }}%</output>
                                    <p class="text-muted"><small>Adjust text shadow and contrast for better readability.</small></p>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-12">
                                <label class="control-label">Custom CSS</label>
                                <div>
                                    <textarea class="form-control" name="theme:custom_css" rows="8" placeholder="/* Add your custom CSS here */">{{ old('theme:custom_css', config('theme.custom_css', '')) }}</textarea>
                                    <p class="text-muted"><small>Add custom CSS to further customize the appearance. Use with caution.</small></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="box-footer">
                        {!! csrf_field() !!}
                        <button type="submit" name="_method" value="PATCH" class="btn btn-sm btn-primary pull-right">Save Theme Settings</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection
