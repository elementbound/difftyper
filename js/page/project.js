function manual_hide(selector) {
    $(selector)
        .removeClass("hidden")
        .hide();
}

$(document).ready(function () {
    var Project = {
        commits: [],
        tree: new FileTree
    };

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
        var do_commit = function() {
            if(Project.commits.empty())
                return false;

            let commit = Project.commits.shift();
            console.log(commit);

            for(let i = 0; i < commit.files.length; i++) {
                let file = commit.files[i];

                if(file.mode == 'new')
                    Project.tree.add(file.name);
                else if(file.mode == 'delete')
                    Project.tree.remove(file.name);
            }

            return true;
        }

        var f = function() {
            if(do_commit())
                setTimeout(f, 500);
        }

        f();
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
});
