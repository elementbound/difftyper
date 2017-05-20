$(document).ready(function() {
    /*** Init ***/
    var typer = new Typer();

    /*** Wire up events ***/
    // Add frame buttons:
    $(".typer.add").each(function(idx, e) {
        var source = $(this).attr('data-source');
        source = $(source);

        $(this).click(function() {
            let diff = source.val();

            typer.add_diff(diff);
            source.val('');
        })
    });

    // Run typer buttons:
    $(".typer.run").each(function(idx, e) {
        $(this).click(function() {
            // $("#code").text(typer.ops.join('\n'));
            typer.run(wpm(800));
        })
    });

    // Typer present
    $(typer).on('present', function(e, lines) {
        $('#code').text(lines.join('\n'));
        // console.log(lines);
    })
});
