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
                    row.attr('id', 'commit-row-'+commits[i]);

                $('<td>')
                    .text(commits[i].substr(0, 16) + '...')
                    .addClass('commit-hash')
                    .appendTo(row);

                $('<td>')
                    .text('?')
                    .addClass('commit-message')
                    .appendTo(row);

                $('<td>')
                    .text('?')
                    .addClass('commit-date')
                    .appendTo(row);

                row.appendTo(tbody);
            }
        });
    });
});
