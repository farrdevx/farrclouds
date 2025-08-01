<?php $__env->startSection('assets'); ?>
    <link rel="stylesheet" href="/themes/pterodactyl/css/octopus-dashboard.css">
    <link rel="stylesheet" href="/themes/pterodactyl/css/octopus-server.css">
<?php $__env->stopSection(); ?>

<?php $__env->startSection('container'); ?>
    <!-- Shooting Stars Background -->
    <div class="server-shooting-star"></div>
    <div class="server-shooting-star"></div>
    <div class="server-shooting-star"></div>
    <div class="server-shooting-star"></div>
    
    <!-- Floating Particles -->
    <div class="server-floating-particles">
        <div class="server-particle"></div>
        <div class="server-particle"></div>
        <div class="server-particle"></div>
        <div class="server-particle"></div>
        <div class="server-particle"></div>
        <div class="server-particle"></div>
        <div class="server-particle"></div>
        <div class="server-particle"></div>
        <div class="server-particle"></div>
    </div>
    
    <!-- Nebula Background Elements -->
    <svg class="server-nebula server-nebula-1" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path fill="currentColor" d="M48.2,-64.8C61.4,-55.3,70.3,-40.3,75.8,-24.1C81.3,-7.9,83.4,9.5,77.8,24.7C72.2,39.9,58.9,52.9,44.2,62.3C29.5,71.7,13.4,77.5,-3,79.5C-19.4,81.5,-38.8,79.7,-53.4,70.4C-68,61.1,-77.8,44.3,-81.1,26.7C-84.4,9.1,-81.2,-9.4,-73.4,-25.1C-65.6,-40.8,-53.2,-53.8,-39.4,-62.9C-25.6,-72,-10.4,-77.2,3.8,-79.1C18,-81,35,-74.4,48.2,-64.8Z" transform="translate(100 100)" />
    </svg>
    <svg class="server-nebula server-nebula-2" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path fill="currentColor" d="M51.4,-57.8C62.9,-47.9,65.9,-29.3,65.8,-11.9C65.7,5.5,62.5,21.7,54.1,35.5C45.7,49.3,32.1,60.7,16.9,65.8C1.7,70.9,-15.2,69.7,-30.5,62.9C-45.8,56.1,-59.5,43.7,-66.2,28.5C-72.9,13.3,-72.6,-4.7,-66.5,-20.2C-60.4,-35.7,-48.5,-48.7,-34.9,-57.1C-21.3,-65.5,-6,-69.3,9.1,-69.1C24.2,-68.9,39.9,-67.7,51.4,-57.8Z" transform="translate(100 100)" />
    </svg>

    <div id="modal-portal"></div>
    <div id="app"></div>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('templates/wrapper', [
    'css' => ['body' => 'bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 min-h-screen font-inter'],
], \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH /var/www/pterodactyl/resources/views/templates/base/core.blade.php ENDPATH**/ ?>