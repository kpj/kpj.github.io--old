$(document).ready(function() {
    $('hidden-img').each(function(i, himg) {
        $(himg).replaceWith(function() {
            var butt = document.createElement('button');
            $(butt)
                .attr('type', 'button')
                .data('src', $(himg).attr('src'))
                .text('Show Image')
                .on('click', function() {
                    $(this).hide();       
                    var old = $('#hidden-image-' + i);
                    if(old.length > 0) {
                        old.show();
                    } else {
                        var img = document.createElement('img');
                        $(img)
                            .attr('src', $(this).data('src'))
                            .attr('id', 'hidden-image-' + i)
                            .on('click', function() {
                                $(this).hide();
                                $(butt).show();
                            });
                        $(img).insertAfter($(this));
                    }
                });
            return butt;
        });
    });
});
