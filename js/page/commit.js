$(document).ready(function() {
    /** Init **/
    var commit = undefined;

    /** Events **/
    $("#diff-parse").click(function() {
        commit = new Commit($("#diff").val());

        $("#commit-hash").text(commit.hash);
        $("#commit-author").text(commit.author);
        $("#commit-date").text(commit.date);
        $("#commit-message").text(commit.message);

        $("#commit-files>.file").remove();

        let table = $("#commit-files");
        $("tr.file").remove();

        let tbody = table.find('tbody');

        for(let i = 0; i < commit.files.length; i++) {
            file = commit.files[i];
            let diff = file.diff;
            if(diff.length > 200)
                diff = diff.substr(0, 200) + '...';

            let row = $('<tr>').addClass('file');

            $('<td>')
                .text(file.name)
                .appendTo(row);

            $('<td>')
                .addClass('preserve-ws')
                .text(diff)
                .appendTo(row);

            tbody.append(row);
        }
    });
});
