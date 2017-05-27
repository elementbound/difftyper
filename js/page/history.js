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
        if(!this._to_load.length) {
            $(this).trigger('finish');
            return false;
        }

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
    /** Init **/
    $("#commit-progress")
        .removeClass("hidden")
        .hide();

    /** Events **/
    $("#repo-load").click(function() {
        let repo = $("#repo-path").val();
        let loader = new CommitDetailLoader(repo);

        // Reset progressbar
        $("#commit-progress").removeClass("progress-bar-danger");
        $("#commit-progress").slideDown();
        $("#commit-progress>.progress-bar").css("width", 0);

        // Reset commits table
        $("#commits>tbody").empty();

        $(loader).on('progress', function(e, current, max) {
            $("#commit-progress>.progress-bar")
                .attr("aria-valuemin", 0)
                .attr("aria-valuemax", max)
                .attr("aria-valueat", current)
                .css("width", (current / max)*100 + "%")
                .find(".progress-label")
                    .text(current + '/' + max);
        });

        $(loader).on('commit', function(e, commit) {
            let tbody = $("#commits>tbody");

            let row = $("<tr>");

            // Commit, Message, Date
            $("<td>")
                .text(commit.hash.substr(0, 12) + '...')
                .appendTo(row);

            $("<td>")
                .text(commit.message)
                .appendTo(row);

            $("<td>")
                .text(commit.date)
                .appendTo(row);

            row.prependTo(tbody);
        });

        $(loader).on('error', function(e) {
            $("#commit-progress").addClass("progress-bar-danger");
        });

        $(loader).on('finish', function(e) {
            setTimeout(function() {
                $("#commit-progress").slideUp();
            }, 1000);
        });

        loader.query_list();
    });
});
