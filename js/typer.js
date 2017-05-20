// Some array utils
if(!Array.prototype.empty)
    Array.prototype.empty = function() {
        return this.length == 0;
    }

class Typer {
    constructor() {
        // Set defaults for most
        this.clear();
    }

    clear() {
        this.lines = [];
        this.ops = [];

        this._at = 0;
        this._op = undefined;
    }

    newline() {
        if(this.lines.empty()) {
            this.lines.push('');
            this._at = 0;
        }
        else {
            this._at++;
            this.lines.splice(at, 0, '');
        }
    }

    rmline() {
        this.lines.splice(this._at);
    }

    type() {
        if(this._op == undefined) {
            if(this.ops.empty())
                return false;
            else {
                this._op = this.ops.shift();
                this._op_begin(this._op);
            }
        }

        _op_do(this._op);

        return true;
    }

    _op_begin(op) {
        ;
    }

    _op_do(op) {
        if(op[0] == 'jumpto') {
            this._at = op[1];
            this._op_consume();
        }
        else if(op[0] == 'del') {
            this.rmline();
            this._op_consume();
        }
        else if(op[0] == 'add') {
            while(true) {
                let c = op[1].charAt(0);
                op[1] = op[1].slice(1);

                this.lines[this._at] += c;

                // Encountered something that is not a whitespace;
                // stop typing for this frame
                if(!/\s+/.test(c))
                    break;
            }

            if(!op[1])
                this._op_consume(); 
        }
    }

    _op_finish(op) {
        ;
    }

    _op_consume() {
        _op_finish(this._op);
        this._op = undefined;
    }

    static parse_diff(diffstr) {
        let ret = [];
        let difflines = diffstr.split('\n');

        for (let i = 0; i < difflines.length; i++) {
            let line = difflines[i];

            if (line.startsWith('+'))
                ret.push(['add', line.slice(1)]);
            } else if (line.startsWith('-'))
                ret.push(['del']);
            else if (line.startsWith('@@')) {
                let p = /@@\s*-(\d+),(\d+)\s*+(\d+),(\d+)\s*@@*/i;
                console.log('Hunk matches:', p.exec(line));

                let at = p.exec(line)[1];
                at = parseInt(at);

                ret.push(['jumpto', at]);
            } else if (line.startsWith(' '))
                ret.push(['skip']);
        }

        console.log(ret);
        return ret;
    }
}
