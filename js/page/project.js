function manual_hide(selector) {
    $(selector)
        .removeClass("hidden")
        .hide();
}

class Project {
    constructor() {
        this.commits = [];
        this.tree = undefined;
        this.typer = undefined;

        this.current_file = undefined;

        this._queue = [];

        /* Always clear up listeners after finishing */
        $(this).on('finish', function() {
            $(this).unbind('next-step', this.step);
        })
    }

    reset() {
        this.tree = new FileTree();
        this.typer = new Typer();

        $(this.tree).on('change', function() {
            $(this).trigger('tree-change', [this.tree]);
        }.bind(this));

        $(this.typer).on('present', function(e, lines) {
            $(this).trigger('render-code', [lines, this.typer]);
        }.bind(this));
    }

    run() {
        // Reset
        this.reset();

        // Wire events
        $(this.typer).on('finish', function() {this.step()}.bind(this));
        $(this.typer).on('present', function() {
            this.current_file.content = this.typer.lines.join('\n')
        }.bind(this));

        // Query ops
        this._queue = [];

        for(let commit of this.commits.iterate()) {
            this._queue.push(['commit', commit]);

            for(let file of commit.files.iterate()) {
                // TODO: Ignore binary files
                // TODO: If a huge file is added, don't type it just assume it was copied there

                // Add/remove necessary file
                if(file.mode == 'new')
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
        $(this).on('next-step', this.step);
        this.step();
    }

    step() {
        if(this._queue.empty()) {
            $(this).trigger('finish');
            return false;
        }

        let op = this._queue.shift();
        console.log('Step:', op);

        const op_map = {
            'commit': this._op_commit,
            'add-file': this._op_add_file,
            'remove-file': this._op_remove_file,
            'open-file': this._op_open_file,
            'type': this._op_type
        };

        // This looks sick and I believe it should look sick
        op_map[op[0]].bind(this)(...op);

        return true;
    }

    // ['commit', commit]
    _op_commit(type, commit) {
        console.log('[op]commit:', commit);
        $(this).trigger('render-commit', [commit]);
        $(this).trigger('next-step');
    }

    // ['add-file', file]
    _op_add_file(type, file) {
        this.tree.add(file.name);
        console.log('Added file:', file.name);
        $(this).trigger('next-step');
    }

    // ['remove-file', file]
    _op_remove_file(type, file) {
        this.tree.remove(file.name);
        $(this).trigger('next-step');
    }

    // ['open-file', file]
    _op_open_file(type, file) {
        this.current_file = this.tree.find(file.name);

        console.log(file.name, this.current_file);
        $(this).trigger('render-file', [file.name, this.current_file]);
        $(this).trigger('next-step');
    }

    // ['type', file]
    _op_type(type, file) {
        this.typer.clear();
        this.typer.setlines(this.current_file.content);
        this.typer.add_diff(file.diff);

        console.log('About to type');
        console.log('Lines:', this.typer.lines);
        console.log('Diff:', file.diff);

        /* $(this.typer).on('finish', function() {
            $(this).trigger('next-step');
        }.bind(this)); */

        this.typer.run(1000/5);
    }
};

$(document).ready(function () {
    let project = new Project();

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
            project.commits.push(commit);
        });

        $(loader).on('finish', function(e) {
            $("#run").fadeIn();
        });

        loader.query_all();
    });

    $("#run").click(function() {
        project.run();
    });

    /** Project events **/
    $(project).on('render-commit', function(e, commit) {
        $("#commit-hash").text(commit.hash);
        $("#commit-author").text(commit.author);
        $("#commit-message").text(commit.message);
    });

    $(project).on('render-file', function(e, name, node) {
        $("#current-file").text(name);
        $("#code").text(node.content);
    });

    /** Tree events **/
    $(project).on('tree-change', function() {
        let tree = project.tree;
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
    $(project).on('render-code', function(e, lines) {
        $('#code').text(lines.join('\n'));
        $('#code').removeClass('prettyprinted');
        PR.prettyPrint();

        // Scroll to cursor
        let font_size = $("#code").css("font-size");
        font_size = /\d+/.exec(font_size)[0];
        font_size = parseInt(font_size);

        let to = font_size * project.typer._at;

        console.log("Scrolling to", to);
        $("#code").scrollTop(to);
    });

    $("#step").click(function() {
        project.step();
    })
});
