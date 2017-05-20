$(document).ready(function() {
    /*** Wire up events ***/
    // Add frame buttons:
    $(".typer.add").each(function(idx, e) {
        var source = $(this).attr('data-source');
        source = $(source);

        $(this).click(function() {
            let diff = source.text();
            // TODO: do something with diff
            console.log("Adding diff: \n", diff);
            source.text('');
        })
    });

    // Run typer buttons:
    $(".typer.run").each(function(idx, e) {
        $(this).click(function() {
            // TODO: Actually run it
            console.log("Running typer");
        })
    });
});
