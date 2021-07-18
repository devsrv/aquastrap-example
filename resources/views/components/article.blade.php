<div>
    <script>
        // directive - config for the current component
        {{-- @aquaconfig($drips).onSuccess((res) => console.info('successful from config', res)).onError((err) => console.warn('something went wrong', err)); --}}

        // js helper - config for the current component
        // Aquastrap.component('article').onSuccess((res) => console.info('successful from helper config', res)).onError((err) => console.warn('something went wrong', err));

        // js helper - global config
        {{-- Aquastrap.onSuccess((res) => console.info('successful', res)).onError((err) => console.warn('something went wrong', err)); --}}
    </script>

    <h2>Article Component </h2>

    <x-ui.card title="By Calling a Vanilla Function">
        <button type="button" onclick="query({name: 'rav'})">Exec</button>
    </x-ui.card>

    <x-ui.card>
        <x-slot name="title">
            <h5>Direct Call aqua method <code>@@aqua($drips).delete()</code></h5>
        </x-slot>

        <button type="button" onclick="@aqua($drips).delete({name: 'rav'})">Exec</button>
    </x-ui.card>

    <hr />

    <h4>Alpine Examples</h4>

    <x-ui.card>
        <x-slot name="title">
            <h5>Direct Destructure <code class="small">x-data="{foo:'bar', ...@@aqua($drips) }"</code></h5>
        </x-slot>

        <button x-data="{foo:'bar', ...@aqua($drips) }" type="button" x-on:click="update({id: 2})">EXEC -> update({id: 2})</button>
    </x-ui.card>

    <x-ui.card title="Hook method">
        <div class="p-3">
            <div x-data="{...singleUpload(), ...multipleUpload(), ...fileValidationHelper(), form:{email: '', profile: null, avatar: null}, ...@aqua($drips).hook }">
                <p x-show="update.processing">loading...</p>
                <p x-show="! update.processing && update.result" x-effect="() => console.log('x-effect', update.result)"></p>
                <p x-show="update.hasValidationError">validation error!</p>
                <p x-text="update.message"></p>
                <p x-text="update.statusCode"></p>
                <form x-on:submit.prevent="update.post(form)">
                    <div class="col-12">
                        <input x-model="form.email" placeholder="Email" class="form-control" :class="{'is-invalid': update.errors.email}" type="text" />
                        <small x-show="update.errors.email" x-text="update.errors.email" class="invalid-feedback"></small>
                    </div>
                    <div class="col-12 mt-2">
                        <input x-on:change="form.profile = $el.files[0]" class="form-control" :class="{'is-invalid': update.errors.profile}" type="file" />
                        <small x-show="update.errors.profile" x-text="update.errors.profile" class="invalid-feedback"></small>
                    </div>
                    <div class="col-12 mt-2">
                        <label class="form-label">single file preview</label>
                        <input x-on:change="previewSingleFile('avatar', $el, $refs.previewSingle, $refs.previewSingleSize, $refs.previewSingleName)" x-ref="avatarfld" class="form-control" :class="{'is-invalid': update.errors.avatar}" type="file" />
                        <div class="preview position-relative">
                            <div class="position-absolute top-0" style="left:60px">
                                <template x-if="form.avatar">
                                    <button @click.prevent="clearSingleFile('avatar', $refs.avatarfld, $refs.previewSingle, $refs.previewSingleSize, $refs.previewSingleName)" type="button" class="btn btn-sm">&times;</button>
                                </template>
                            </div>

                            <img x-ref="previewSingle" src="" class="rounded mt-1" width="80" />
                            <p x-ref="previewSingleSize" class="mb-1"></p>
                            <p x-ref="previewSingleName" class="mb-0"></p>
                        </div>
                        <small x-show="update.errors.avatar" x-text="update.errors.avatar" class="invalid-feedback"></small>
                    </div>
                    <div class="col-12 mt-2">
                        <label class="form-label">multiple file</label>
                        <input x-on:change="previewMultipleFile('tour', $el)" x-ref="tourfld" class="form-control" :class="{'is-invalid': hasMultiFileError('tour')}" type="file" multiple />
                        <div class="preview">
                            <template x-if="filesList.tour && filesList.tour.length > 0">
                                <div>
                                    <ul>
                                        <template x-for="(tour, index) in filesList.tour" :key="index">
                                            <li>
                                                [<span x-text="tour.size"></span>] - <span x-text="tour.name"></span>
                                            </li>
                                        </template>
                                    </ul>
                                    <button @click.prevent="clearMultiFiles('tour', $refs.tourfld)" type="button" class="btn btn-sm">&times; clear</button>
                                </div>
                            </template>
                        </div>
                        <small x-effect="() => checkMultipleFileUploadError('tour', $refs.tourfld, update.errors)" class="invalid-feedback">
                            <template x-if="fileErrors.tour && fileErrors.tour.length > 0">
                                <ul>
                                    <template x-for="(err, index) in fileErrors.tour" :key="index">
                                        <li x-text="err"></li>
                                    </template>
                                </ul>
                            </template>
                        </small>
                    </div>
                    <button class="btn btn-sm btn-primary mt-2" :disabled="update.processing" type="submit">Save</button>
                </form>
            </div>
        </div>
    </x-ui.card>

    <x-ui.card>
        <x-slot name="title">
            <h5>Destructure to a state <code class="small">x-data="{foo:'bar', ...{ _m: @@aqua($drips)} }"</code></h5>
        </x-slot>

        <button x-data="{foo:'bar', ...{ _m: @aqua($drips)} }" type="button" x-on:click="_m.delete({name: 'rav'}, 'DELETE')">EXEC -> _m.delete({name: 'rav'}, 'DELETE')</button>
    </x-ui.card>

    <x-ui.card>
        <x-slot name="title">
            <h5>Global Helper <code class="small">Aquastrap.component('article').delete</code></h5>
        </x-slot>

        <button x-data type="button" x-on:click="Aquastrap.component('article').delete({name: 'rav'})">Exec</button>
    </x-ui.card>

    <x-ui.card title="Get the routes using Global Helper">
        <div x-data="{routes: {}}">
            <button type="button" x-on:click="routes = Aquastrap.component('article').routes">Routes</button>
            <small x-text="JSON.stringify(routes)"></small>
        </div>
    </x-ui.card>

    <x-ui.card title="On Load Fetch">
        <div x-data="{res: {}, ...{ _m: @aqua($drips)} }" x-init="res = await _m.delete({name: 'rav'})">
            <small x-text="JSON.stringify(res)">Res</small>
        </div>
    </x-ui.card>

    <x-ui.card title="On Load Fetch with loading & disabled btn">
        <div x-data="{loading: false, res: {}, ...{ _m: @aqua($drips)} }" x-init="loading = true; _m.delete({name: 'rav'}).then((d) => {res = d; loading = false;})">
            <div>
                <small x-show="loading">Loading . . .</small>
                <small x-show="! loading && res" x-text="JSON.stringify(res)"></small>
            </div>
        </div>
    </x-ui.card>

    <x-ui.card title="Route extracted manually fetch">
        <div x-data="{ posts: [] }">
            <button type="button" x-on:click="posts = await (await fetch('{{ $aquaroute('delete') }}', {method: 'post'})).json()">Fetch</button>
            <small x-text="JSON.stringify(posts)">loading. . .</small>
        </div>
    </x-ui.card>

    <script>
        function query({data}) {
            const _ntwrk = @aqua($drips);

            // using reference
            _ntwrk.delete(data)
                .then(res => console.log('success', res));

            // call directly
            // @aqua($drips)
            //     .delete(data)
            //     .then(res => console.log(res))
        }
    </script>

    <script>
        document.addEventListener('alpine:init', () => {
            Alpine.data('singleUpload', () => ({
                fileFallbackPreview: 'data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZm9jdXNhYmxlPSJmYWxzZSIgZGF0YS1wcmVmaXg9ImZhbCIgZGF0YS1pY29uPSJmaWxlLWFsdCIgcm9sZT0iaW1nIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIiBjbGFzcz0ic3ZnLWlubGluZS0tZmEgZmEtZmlsZS1hbHQgZmEtdy0xMiBmYS0zeCI+PHBhdGggZmlsbD0iY3VycmVudENvbG9yIiBkPSJNMzY5LjkgOTcuOUwyODYgMTRDMjc3IDUgMjY0LjgtLjEgMjUyLjEtLjFINDhDMjEuNSAwIDAgMjEuNSAwIDQ4djQxNmMwIDI2LjUgMjEuNSA0OCA0OCA0OGgyODhjMjYuNSAwIDQ4LTIxLjUgNDgtNDhWMTMxLjljMC0xMi43LTUuMS0yNS0xNC4xLTM0em0tMjIuNiAyMi43YzIuMSAyLjEgMy41IDQuNiA0LjIgNy40SDI1NlYzMi41YzIuOC43IDUuMyAyLjEgNy40IDQuMmw4My45IDgzLjl6TTMzNiA0ODBINDhjLTguOCAwLTE2LTcuMi0xNi0xNlY0OGMwLTguOCA3LjItMTYgMTYtMTZoMTc2djEwNGMwIDEzLjMgMTAuNyAyNCAyNCAyNGgxMDR2MzA0YzAgOC44LTcuMiAxNi0xNiAxNnptLTQ4LTI0NHY4YzAgNi42LTUuNCAxMi0xMiAxMkgxMDhjLTYuNiAwLTEyLTUuNC0xMi0xMnYtOGMwLTYuNiA1LjQtMTIgMTItMTJoMTY4YzYuNiAwIDEyIDUuNCAxMiAxMnptMCA2NHY4YzAgNi42LTUuNCAxMi0xMiAxMkgxMDhjLTYuNiAwLTEyLTUuNC0xMi0xMnYtOGMwLTYuNiA1LjQtMTIgMTItMTJoMTY4YzYuNiAwIDEyIDUuNCAxMiAxMnptMCA2NHY4YzAgNi42LTUuNCAxMi0xMiAxMkgxMDhjLTYuNiAwLTEyLTUuNC0xMi0xMnYtOGMwLTYuNiA1LjQtMTIgMTItMTJoMTY4YzYuNiAwIDEyIDUuNCAxMiAxMnoiIGNsYXNzPSIiPjwvcGF0aD48L3N2Zz4=',
                isImage(file) {
                    return file.type.match("image.*");
                },
                fileSize(file) {
                    return file.size > 1024
                    ? file.size > 1048576
                        ? Math.round(file.size / 1048576) + "mb"
                        : Math.round(file.size / 1024) + "kb"
                    : file.size + "b";
                },
                previewSingleFile(formField, field, target, sizeNode, nameNode) {
                    const file = field.files[0];

                    if(!file) {
                        target.setAttribute('src', '');
                        this.form[formField] = null;
                        field.value = null;
                        sizeNode.textContent = '';
                        nameNode.textContent = '';
                        return;
                    }

                    this.form[formField] = file;    // alpine form state value set to file

                    URL.revokeObjectURL(target.src);  // reset previous

                    sizeNode.textContent = this.fileSize(file);
                    nameNode.textContent = file.name;

                    if(! this.isImage(file)) {
                        target.src = this.fileFallbackPreview;
                        return;
                    }

                    target.src = URL.createObjectURL(file);
                    target.onload = () => URL.revokeObjectURL(target.src);
                },
                clearSingleFile(formField, field, target, sizeNode, nameNode) {
                    this.form[formField] = null;
                    field.value = null;
                    sizeNode.textContent = '';
                    nameNode.textContent = '';

                    URL.revokeObjectURL(target.src);
                    target.setAttribute('src', '');
                }
            }));

            Alpine.data('multipleUpload', () => ({
                filesList: {},
                fileSize(file) {
                    return file.size > 1024
                    ? file.size > 1048576
                        ? Math.round(file.size / 1048576) + "mb"
                        : Math.round(file.size / 1024) + "kb"
                    : file.size + "b";
                },
                previewMultipleFile(formField, field) {
                    const files = field.files;
                    this.form[formField] = files;

                    this.filesList[formField] = [];

                    if(files.length === 0) return;

                    let i = 0;
                    while (i < files.length) {
                        this.filesList[formField] = [
                            ...this.filesList[formField],
                            {
                                size: this.fileSize(files[i]),
                                name: files[i].name
                            }
                        ];

                        i++;
                    }
                },
                clearMultiFiles(formField, field) {
                    this.form[formField] = null;
                    field.value = null;

                    this.filesList[formField] = [];
                }
            }));

            Alpine.data('fileValidationHelper', () => ({
                fileErrors: {},
                checkMultipleFileUploadError(formFieldName, field, errors) {
                    this.fileErrors = {
                        ...this.fileErrors,
                        [formFieldName] : []
                    };

                    if(field.files.length) {
                        Array(field.files.length).fill().map((_,i) => {
                            if(Object.prototype.hasOwnProperty.call(errors, `${formFieldName}.${i}`)) {
                                this.fileErrors = Object.assign({}, this.fileErrors, {
                                    [formFieldName] : [
                                        ...this.fileErrors[formFieldName],
                                        errors[`${formFieldName}.${i}`]
                                    ]
                                });
                            }
                        });
                    }
                },
                hasMultiFileError(formFieldName) {
                    return Object.prototype.hasOwnProperty.call(this.fileErrors, formFieldName) && this.fileErrors[formFieldName].length > 0;
                }
            }));
        })
    </script>
</div>
