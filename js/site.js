$(document).ready(function() {
    /*** Init ***/
    var typer = new Typer();

    $("#start-tools").removeClass('hidden');
    $("#stop-tools").removeClass('hidden').hide();

    /*** Wire up events ***/
    // Add frame buttons:
    $(".typer.add").click(function() {
        let source = $(this).attr('data-source');
        source = $(source);

        let diff = source.val();

        typer.add_diff(diff);
        source.val('');
    });

    // Run typer buttons:
    $(".typer.run").click(function() {
        $('#code').text('');

        typer.run(wpm(800));

        $("#start-tools").hide();
        $("#stop-tools").show();
    });

    // Typer present
    $(typer).on('present', function(e, lines) {
        $('#code').text(lines.join('\n'));
        // console.log(lines);
    });

    $(typer).on('finish', function(e) {
        $("#stop-tools").hide();
        $("#start-tools").show();
    });

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

        $("#stop-tools").hide();
        $("#start-tools").show();
    });
});
