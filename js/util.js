class CommitDetailLoader {
    constructor(repo) {
        this.repository = repo;
        this.commits = [];

        this._to_load = [];
    }

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
            console.log('Hashes to load:', this._to_load);
            $(this).trigger('list', [data.commits]);
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
        }.bind(this));
    }

    // Load all data
    query_all() {
        // Callbacks to keep it moving
        $(this).on('list', this.query_next_commit);
        $(this).on('commit', this.query_next_commit);

        // Callbacks to update on progress
        $(this).on('commit', function() {
            $(this).trigger('progress', [this.commits.length, this.commits.length + this._to_load.length]);
        }.bind(this));

        $(this).on('list', function(e, commits) {
            $(this).trigger('progress', [0, commits.length]);
        }.bind(this));

        this.query_list();
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
