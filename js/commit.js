            this.date = new Date(this.date);
                let file = {
                    name: '',
                    diff: [],
                    mode: 'change'
                };

                file.diff = file.diff.join('\n');
                this.files.push(file);
            }