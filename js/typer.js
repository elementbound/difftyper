// Some array utils
if(!Array.prototype.empty)
    Array.prototype.empty = function() {
        return this.length == 0;
    }

// Convert words per minute into timeout between key presses
function wpm(w) {
    return 1000 / (w * 5 / 60);
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
        this._state = 'stop';
    }

    newline() {
        if(this.lines.empty()) {
            this.lines.push('');
            this._at = 0;
        }
        else {
            this._at++;
            this.lines.splice(this._at, 0, '');
        }
    }

    skipline() {
        this._at++;
        if(this.lines[this._at] == undefined)
            this.lines[this._at] = '';
    }

    rmline() {
        this.lines.splice(this._at, 1);
    }

    add_diff(diffstr) {
        this.ops.push(...Typer.parse_diff(diffstr));
    }

    run(rest = wpm(400)) {
        this._state = 'run';

        var f = function() {
            if(this._state == 'run')
                if(!this.type())
                    this._state = 'stop';

            if(this._state == 'run' || this._state == 'pause')
                setTimeout(f, rest);
            else
            $(this).trigger('finish');
        }

        f = f.bind(this);
        f();
    }

    pause() {
        if(this._state == 'run')
            this._state = 'pause';
    }

    continue() {
        if(this._state == 'pause')
            this._state = 'run';
    }

    stop() {
        this._state = 'stop';
    }

    is_running() {
        return this._state == 'run';
    }

    is_stopped() {
        return this._state == 'stop';
    }

    is_paused() {
        return this._state == 'pause';
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

        this._op_do(this._op);

        $(this).trigger('present', [this.lines]);

        return true;
    }

    _op_begin(op) {
        if(op[0] == 'add')
            this.newline();
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
        else if(op[0] == 'skip') {
            this.skipline();
            this._op_consume();
        }
    }

    _op_finish(op) {
        ;
    }

    _op_consume() {
        this._op_finish(this._op);
        this._op = undefined;
    }

    static parse_diff(diffstr) {
        let ret = [];
        let difflines = diffstr.split(/\n|\r\n/);

        console.log('Diff string is:\n', difflines);

        for (let i = 0; i < difflines.length; i++) {
            let line = difflines[i];

            if (line.startsWith('+'))
                ret.push(['add', line.slice(1)]);
            else if (line.startsWith('-'))
                ret.push(['del']);
            else if (line.startsWith('@@')) {
                let p = /@@\s*-(\d+),(\d+)\s*\+(\d+),(\d+)\s*@@/i;
                console.log('Hunk matches:', p.exec(line));

                let at = p.exec(line)[1];
                at = parseInt(at);

                ret.push(['jumpto', at]);
            } else if (line.startsWith(' '))
                ret.push(['skip']);
            else
                ret.push(['skip']); // Skip unknown lines
        }

        return ret;
    }
}
