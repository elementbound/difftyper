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
                $(this).trigger('error', {
                    commit: '*',
                    error: data.error
                });
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

        var hash = this._to_load.shift();

        console.log('/' + ['api', 'git', 'show', hash, this.repository].join('/'));
        $.getJSON('/' + ['api', 'git', 'show', hash, this.repository].join('/'), function(data) {
            if(data.error) {
                $(this).trigger('error', {
                    commit: hash,
                    error: data.error
                });
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

// I mean I could have easily written this myself but eh
// Thanks, Marko
// https://stackoverflow.com/a/3552493/8055783

// p.s.: actually had to add time part myself
function formatDate(datetime) {
    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    var day = datetime.getDate();
    var monthIndex = datetime.getMonth();
    var year = datetime.getFullYear();

    let hour = datetime.getHours(); hour = hour < 10 ? '0'+hour : hour.toString();
    let minute = datetime.getMinutes(); minute = minute < 10 ? '0'+minute : minute.toString();
    let second = datetime.getSeconds(); second = second < 10 ? '0'+second : second.toString();

    let date = day + ' ' + monthNames[monthIndex].substr(0,3) + ' ' + year;
    let time = [hour, minute, second].join(':');

    return date + ' ' + time;
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

            let row = $("<tr>");

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

        loader.query_list();
    });
});
