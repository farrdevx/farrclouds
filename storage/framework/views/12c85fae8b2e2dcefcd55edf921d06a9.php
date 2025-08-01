<?php $__env->startSection('assets'); ?>
    <link rel="stylesheet" href="/themes/pterodactyl/css/octopus-auth.css">
<?php $__env->stopSection(); ?>

<?php $__env->startSection('container'); ?>
    <div id="app"></div>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('templates/wrapper', [
    'css' => ['body' => 'bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 min-h-screen font-inter auth-page']
], \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH /var/www/pterodactyl/resources/views/templates/auth/core.blade.php ENDPATH**/ ?>