$(document).ready(function() {
    /** Init **/
    var tree = new FileTree();
    tree.root().value = 'git:'; 

    /** Events **/
    $("#add-entry").click(function() {
        tree.add($("#entry").val());
    });

    $("#remove-entry").click(function() {
        tree.remove($("#entry").val());
    });

    $(tree).on('change', function() {
        let table = $("#tree>tbody");
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
