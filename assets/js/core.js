window.onload = function() {
    var himgs = document.getElementsByTagName('hidden-img');

    for(var p in himgs) {
        var himg = himgs[p];
        if(typeof himg.parentNode === 'undefined')
            continue;

        var butt = document.createElement('button');
        $(butt)
            .attr('type', 'button')
            .data('src', $(himg).attr('src'))
            .text('Show Image')
            .on('click', function() {
                var img = document.createElement('img');
                img.src = $(this).data('src');
                $(this).replaceWith($(img));
            });

        himg.parentNode.replaceChild(butt, himg);
    }
}
