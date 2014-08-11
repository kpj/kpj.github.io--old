$(document).ready(function() {
    PLUGINS.forEach(function(plugin) {
        plugin.apply();
    });
});
