class TreeNode {
    constructor(value) {
        this.value = value;
        this._children = [];
        this._parent = undefined;
        this._depth = 0;
    }

    parent() {
        return this._parent;
    }

    depth() {
        return this._depth;
    }

    // Iterator for direct children
    * children(reverse = false) {
        for(let i = 0; i < this._children.length; i++) {
            if(!reverse)
                yield this._children[i];
            else
                yield this._children[this._children.length - 1 - i];
        }
    }

    add_child(child) {
        this._children.push(child);
        child._depth = this._depth + 1;
        child._parent = this;
        return child;
    }

    remove_child(child) {
        for(let i = 0; i < this._children.length; i++)
            if(child == this._children[i]) {
                this._children.splice(i, 1);
                return true;
            }

        return false;
    }

    remove_index(at) {
        this._children.splice(at, 1);
    }

    find_by_value(value) {
        for(let child of this.children())
            if(child.value == value)
                return child;

        return undefined;
    }

    is_empty() {
        return this._children.length == 0;
    }

    children_count() {
        return this._children.length;
    }
}

class FileNode extends TreeNode {
    sort(recursive=false) {
        // Sort children alphabetically
        this._children.sort();

        // Then sort with directories ( branches ) first and files ( leaves ) second
        let branches = [];
        let leaves = [];

        for(let c of this.children())
            if(c.is_empty())
                leaves.push(c);
            else
                branches.push(c);

        this._children = [];
        this._children.push(...branches);
        this._children.push(...leaves);

        if(recursive)
            for(let c of this.children())
                c.sort(true);
    }
}

class Tree {
    constructor() {
        this._root = new TreeNode();
    }

    * iterate(depth_first = true) {
        let queue = [this._root];
        let at = undefined;

        while(queue.length) {
            if(depth_first)
                at = queue.pop();
            else
                at = queue.shift();

            yield at;

            // Iterate children in reverse order
            for(let child of at.children(true))
                queue.push(child);
        }
    }

    // Generator function to return nodes depth-first
    * depth_first() {
        return this.iterate(true);
    }

    // Generator function to return nodes breadth-first
    * breadth_first() {
        return this.iterate(false);
    }

    // Return root node
    root() {
        return this._root;
    }
}

class FileTree extends Tree {
    constructor() {
        super();
        this._root = new FileNode('/');

        console.log('Constructor;', this._root);
    }

    add(path) {
        path = FileTree.parse_path(path);
        let at = this._root;

        for(let i = 0; i < path.length; i++) {
            let part = path[i];
            let next = at.find_by_value(part);

            if(next == undefined)
                at = at.add_child(new FileNode(part));
            else
                at = next;
        }

        // Sort nodes recursively
        this._root.sort(true);

        $(this).trigger('change');
    }

    remove(path) {
        path = FileTree.parse_path(path);
        let at = this._root;

        for(let i = 0; i < path.length; i++) {
            let part = path[i];
            let next = at.find_by_value(part);

            // Path doesn't exist in tree, bail
            if(next == undefined)
                return false;
        }

        let removed = 0;
        while(at != this._root) {
            let next = at.parent();

            next.remove_child(at);
            ++removed;

            // Check if parent is now empty
            // If it is, remove it, otherwise stop
            if(next.is_empty())
                at = next;
            else
                break;
        }

        $(this).trigger('change');

        // Return how many nodes we removed
        return removed;
    }

    static parse_path(path) {
        return path.split('/');
    }
}
