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
        console.log('/api/git/commits/' + this.repository);
        $.getJSON('/api/git/commits/' + this.repository, function(data) {
            if(data.error) {
                $(this).trigger('error');
                return true;
            }

            this._to_load = data.commits;
            $(this).trigger('list', [data.commits]);

            $(this).trigger('progress', [0, this._to_load.length]);
            this.query_next_commit();
        }.bind(this));
    }

    query_next_commit() {
        if(!this._to_load.length)
            return false;

        let hash = this._to_load.shift();

        console.log('/' + ['api', 'git', 'show', hash, this.repository].join('/'));
        $.getJSON('/' + ['api', 'git', 'show', hash, this.repository].join('/'), function(data) {
            if(data.error) {
                $(this).trigger('error');
                return true;
            }

            let commit = new Commit(data.commit);
            this.commits.push(commit);

            $(this).trigger('commit', commit);
            $(this).trigger('progress', [this.commits.length, this.commits.length + this._to_load.length]);

            this.query_next_commit();
        }.bind(this));
    }
}

$(document).ready(function() {
    /** Events **/
    $("#repo-load").click(function() {
        let repo = $("#repo-path").val();
        let loader = new CommitDetailLoader(repo);

        console.log('Loading repo', repo);

        $(loader).on('progress', function(e, current, max) {
            $("#commit-progress>.progress-bar")
                .attr("aria-valuemin", 0)
                .attr("aria-valuemax", max)
                .attr("aria-valueat", current)
                .css("width", (current / max)*100 + "%")
                .find(".progress-label")
                    .text(Math.round((current / max)*100) + "%");
        });

        loader.query_list();
    });
});
