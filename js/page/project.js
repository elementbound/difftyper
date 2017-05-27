function manual_hide(selector) {
    $(selector)
        .removeClass("hidden")
        .hide();
}

var Project = {
    commits: [],
    tree: new FileTree(),
    typer: new Typer(),

    current_file: undefined,

    _queue: [],

    reset: function() {
        this.tree = new FileTree();
        this.typer = new Typer();
    },

    run: function() {
        // Query ops
        this._queue = [];

        for(let commit of this.commits.iterate()) {
            this._queue.push(['commit', commit]);

            for(let file of commit.files.iterate()) {
                // TODO: Ignore binary files
                // TODO: If a huge file is added, don't type it just assume it was copied there

                // Add/remove necessary file
                if(file.mode == 'add')
                    this._queue.push(['add-file', file]);
                else if(file.mode == 'delete')
                    this._queue.push(['remove-file', file]);

                // If it's added or changed, type it
                if(file.mode != 'delete') {
                    this._queue.push(['open-file', file]);
                    this._queue.push(['type', file]);
                }
            }
        }

        // Run steps one by one
        $(this).on('step', this.step);
        $(this).on('step', function() {console.log('on Step');});
        this.step();
    },

    step: function() {
        if(this._queue.empty())
            return false;

        let op = this._queue.shift();
        console.log('Step:', op);

        const op_map = {
            'commit': this._op_commit,
            'add-file': this._op_add_file,
            'remove-file': this._op_remove_file,
            'open-file': this._op_open_file,
            'type': this._op_type
        };

        console.log('Calling', op_map[op[0]]);
        op_map[op[0]](...op);

        return true;
    },

    // ['commit', commit]
    _op_commit: function(type, commit) {
        console.log('[op]commit:', commit);
        $(Project).trigger('render-commit', [commit]);
        $(Project).trigger('step');
    },

    // ['add-file', file]
    _op_add_file: function(type, file) {
        this.tree.add(file.name);
        $(this).trigger('step');
    },

    // ['remove-file', file]
    _op_remove_file: function(type, file) {
        this.tree.remove(file.name);
        $(this).trigger('step');
    },

    // ['open-file', file]
    _op_open_file: function(type, file) {
        this.current_file = this.tree.find(file.name);
        $(this).trigger('render-file', [file.name, this.current_file]);
    },

    // ['type', file]
    _op_type: function(type, file) {
        this.typer.clear();
        this.typer.setlines(this.current_file.content);
        this.typer.add_diff(file.diff);

        $(this.typer).on('finish', function() {
            $(this).trigger('step');
        }.bind(this));
    }
};

$(document).ready(function () {
    /** Init **/
    $("#startup-modal").modal();

    manual_hide("#commit-progress");
    manual_hide("#commit-error");
    manual_hide("#run");

    /** Startup events **/
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

        $(loader).on('commit', function(e, commit) {
            Project.commits.push(commit);
        });

        $(loader).on('finish', function(e) {
            $("#run").fadeIn();
        });

        loader.query_all();
    });

    $("#run").click(function() {
        Project.run();
    });

    /** Tree events **/
    $(Project.tree).on('change', function() {
        let tree = Project.tree;
        let table = $("#filetree>tbody");
        table.empty();

        for(let node of tree.depth_first()) {
            let row = $("<tr>");
            $("<td>")
                .text(node.value + (node.is_empty() ? '' : '/'))
                .css("text-indent", (node.depth()*2) + "em")
                .appendTo(row);

            table.append(row);
        }
    });

    /** Typer events **/
    $(Project.typer).on('present', function(e, lines) {
        $('#code').text(lines.join('\n'));
        $('#code').removeClass('prettyprinted');
        PR.prettyPrint();
    });

    /** Project events **/
    $(Project).on('render-commit', function(e, commit) {
        $("#commit-hash").text(commit.hash);
        $("#commit-author").text(commit.author);
        $("#commit-message").text(commit.message);
    });

    $(Project).on('render-file', function(e, name, node) {
        $("#current-file").text(name);
        $("#code").text(node.content);
    });
});
