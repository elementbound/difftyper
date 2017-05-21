class TreeNode {
    construct(value) {
        this.value = value;
        this._children = [];
        this._depth = 0;
    }

    // Iterator for direct children
    children(reverse = false) {
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
        for(child of this.children())
            if(child.value == value)
                return child;

        return undefined;
    }
}

class Tree {
    construct() {
        this._root = new TreeNode();
    }
}

class FileTree extends Tree {
    construct() {
        super();
        this._root.value = '/';
    }

    add(path) {
        path = FileTree.parse_path(path);
        let at = this._root;

        for(let i = 0; i < path.length; i++) {
            let part = path[i];
            let next = this._root.find_by_value(part);

            if(next == undefined)
                at = at.add_child(new TreeNode(part));
            else
                at = next;
        }
    }

    static parse_path(path) {
        return path.split('/');
    }

    // Generator function to return nodes depth-first
    depth_first() {
        let queue = [this._root];
        let at = undefined;

        while(queue.length) {
            at = queue.pop();
            yield at;

            // Iterate children in reverse order
            for(let child of at.children(true))
                queue.push(child);
        }
    }
}
