$(document).ready(function() {
    /** Events **/
    $("#repo-load").click(function() {
        let repo = $("#repo-path").val();

        $.getJSON('/api/git/commits/'+repo, function(data) {
            let tbody = $("#commits").find("tbody");
            tbody.empty();

            if(data.error) {
                let row = $('<tr>');

                $('<td>')
                    .text('Error')
                    .appendTo(row);

                row.appendTo(tbody);

                return true;
            }

            let commits = data.commits;
            for(let i = 0; i < commits.length; ++i) {
                let row = $('<tr>');

                $('<td>')
                    .text(commits[i].substr(0, 16) + '...')
                    .appendTo(row);

                $('<td>')
                    .text('?')
                    .appendTo(row);

                $('<td>')
                    .text('?')
                    .appendTo(row);

                row.appendTo(tbody);
            }
        });
    });
});
