function render_commit(commit) {
    $("#commit-hash").text(commit.hash);
    $("#commit-author").text(commit.author);
    $("#commit-message").text(commit.message);

    $("tr.commit-file").remove();

    console.log(commit.files);
    for(let i = 0; i < commit.files.length; i++) {
        let row = $("<tr>")
            .addClass("commit-file");

        $("<td>")
            .text(commit.files[i].mode)
            .appendTo(row);

        $("<td>")
            .text(commit.files[i].name)
            .appendTo(row);

        $("#commit-files").append(row);
    }
}

$(document).ready(function() {
    /** Init **/
    $("#commit-progress")
        .removeClass("hidden")
        .hide();

    $("#commit-error")
        .removeClass("hidden")
        .hide();

    /** Events **/
    $("#repo-load").click(function() {
        let repo = $("#repo-path").val();
        let loader = new CommitDetailLoader(repo);

        // Reset progressbar
        $("#commit-progress").slideDown();
        $("#commit-progress>.progress-bar")
            .css("width", 0)
            .removeClass("progress-bar-danger");

        // Reset commits table
        $("#commits>tbody").empty();

        // Reset error notif
        $("#commit-error").hide();

        $(loader).on('progress', function(e, current, max) {
            $("#commit-progress>.progress-bar")
                .attr("aria-valuemin", 0)
                .attr("aria-valuemax", max)
                .attr("aria-valueat", current)
                .css("width", (current / max)*100 + "%")
                .text(current + '/' + max);
        });

        $(loader).on('commit', function(e, commit) {
            let tbody = $("#commits>tbody");

            let row = $("<tr>")
                .css('cursor', 'pointer');

            // Commit, Message, Date
            $("<td>")
                .text(commit.hash.substr(0, 12) + '...')
                .appendTo(row);

            $("<td>")
                .text(commit.message)
                .appendTo(row);

            $("<td>")
                .text(formatDate(commit.date))
                .appendTo(row);

            row.click(render_commit.bind(undefined, commit));

            row.prependTo(tbody);
        });

        $(loader).on('error', function(e, error) {
            $("#commit-progress>.progress-bar")
                .addClass("progress-bar-danger")
                .css("width", "100%")
                .text('Error');

            $("#commit-error")
                .html([
                    ['Error: ', error.error].join(''),
                    ['Commit: ', error.commit].join('')
                ].join('<br/>\n'));

            $("#commit-error").slideDown();

            console.log(error);
        });

        $(loader).on('finish', function(e) {
            setTimeout(function() {
                $("#commit-progress").slideUp();
            }, 1000);
        });

        loader.query_all();
    });
});
