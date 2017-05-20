$(document).ready(function() {
    /*** Init ***/
    var typer = new Typer();

    $("#start-tools").removeClass('hidden');
    $("#stop-tools").removeClass('hidden').hide();

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

            $("#start-tools").hide();
            $("#stop-tools").show();
        })
    });

    // Typer present
    $(typer).on('present', function(e, lines) {
        $('#code').text(lines.join('\n'));
        // console.log(lines);
    })

    // Pause typer:
    $(".typer.pause").each(function(idx, e) {
        $(this).click(function() {
            if(typer.is_paused()) {
                $(this).html('Pause');
                typer.continue();
            } else {
                $(this).html('Continue');
                typer.pause();
            }
        });
    });

    // Stop typer:
    $(".typer.stop").click(function(e) {
        typer.stop();
        typer.clear();
        $('#code').text('');

        $("#stop-tools").hide();
        $("#start-tools").show();
    });
});
