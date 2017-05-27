class CommitDetailLoader {
    constructor(repo) {
        this.repository = repo;
        this.commits = [];

        this._to_load = [];

        this.query_list();
    }

    // TODO: Make operations chainable in a nicer way
    // ( what if we don't want to query commit data right away after the list? )
    query_list() {
        $.getJSON('/api/git/commits/' + this.repository, function(data) {
            if(data.error) {
                $(this).trigger('error');
                return true;
            }

            this._to_load = data.commits;
            $(this).trigger('list', [data.commits]);

            $(this).trigger('progress', [0]);
            query_next_commit();
        });
    }

    query_next_commit() {
        if(!this._to_load.length)
            return false;

        let hash = this._to_load.shift();

        $.getJSON('/' + ['api', 'git', 'show', hash, this.repository].join('/'), function(data) {
            if(data.error) {
                $(this).trigger('error');
                return true;
            }

            let commit = new Commit(data.commit);
            this.commits.push(commit);

            $(this).trigger('commit', commit);
            $(this).trigger('progress', [this.commits.length / (this.commits.length + this._to_load.length)]);
        });
    }
}

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
