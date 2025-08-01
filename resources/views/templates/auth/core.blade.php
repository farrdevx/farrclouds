@extends('templates/wrapper', [
    'css' => ['body' => 'bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 min-h-screen font-inter auth-page']
])

@section('assets')
    <link rel="stylesheet" href="/themes/pterodactyl/css/octopus-auth.css">
@endsection

@section('container')
    <div id="app"></div>
@endsection
