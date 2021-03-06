<div>
    <script>
        // directive - config for the current component
        @aquaConfig.onStart(() => console.info('local start'))
        .onSuccess((res) => console.info('local successful from config', res))
        .onError((err) => console.warn('local something went wrong', err))
        .onNotification((notify) => console.info('Local Notification', notify));

        // js helper - global config
        {{--
        Aquastrap.onStart(() => console.info('global start'))
        .onFinish(() => console.info('global finish'))
        .onSuccess((res) => console.info('global successful', res))
        .onError((err) => console.warn('global something went wrong', err))
        .onNotification((notify) => console.info('Global Notification', notify)); --}}
    </script>

    <h2>Article Component </h2>

    <x-ui.card title="By Calling a Vanilla Function">
        <button type="button" onclick="query({name: 'rav'})">Exec</button>
    </x-ui.card>

    <x-ui.card>
        <x-slot name="title">
            <h5>Direct Call aqua method <code>@@aqua.delete()</code></h5>
        </x-slot>

        <button type="button" onclick="@aqua.delete({name: 'rav'})">Exec</button>
    </x-ui.card>

    <x-ui.card>
        <x-slot name="title">
            <h5>Call aqua method with HTTP method</h5>
        </x-slot>

        <button type="button" onclick="@aqua.delete({name: 'rav'}, 'POST')">Exec</button>
    </x-ui.card>

    <x-ui.card>
        <x-slot name="title">
            <h5>Another Aqua Component within one component</h5>
        </x-slot>

        <x-post username="coldsierra" comment="shiva" />
    </x-ui.card>

    <hr />

    <h4>Alpine Examples</h4>

    <x-ui.card>
        <x-slot name="title">
            <h5>Direct Destructure <code class="small">x-data="{foo:'bar', ...@@aqua }"</code></h5>
        </x-slot>

        <button x-data="{foo:'bar', ...@aqua }" type="button" x-on:click="update({id: 2})">EXEC -> update({id: 2})</button>
    </x-ui.card>

    <x-ui.card title="Hook method">
        <div class="p-3">
            <div x-data="{...singleUpload(), ...multipleUpload(), ...fileValidationHelper(), form:{email: '', profile: null, avatar: null}, update: @aqua.hook.update }">
                <p x-show="update.state.processing">loading...</p>
                <p x-show="! update.state.processing && update.state.result" x-effect="() => console.log('x-effect', update.state.result)"></p>
                <p x-show="update.state.hasValidationError">validation error!</p>
                <p x-text="update.state.message"></p>
                <p x-text="update.state.statusCode"></p>
                <form x-on:submit.prevent="update.post(form)">
                    <div class="col-12">
                        <input x-model="form.email" placeholder="Email" class="form-control" :class="{'is-invalid': update.state.errors.email}" type="text" />
                        <small x-show="update.state.errors.email" x-text="update.state.errors.email" class="invalid-feedback"></small>
                    </div>
                    <div class="col-12 mt-2">
                        <input x-on:change="form.profile = $el.files[0]" class="form-control" :class="{'is-invalid': update.state.errors.profile}" type="file" />
                        <small x-show="update.state.errors.profile" x-text="update.state.errors.profile" class="invalid-feedback"></small>
                    </div>
                    <div class="col-12 mt-2">
                        <label class="form-label">single file preview</label>
                        <input x-on:change="previewSingleFile('avatar', $el, $refs.previewSingle, $refs.previewSingleSize, $refs.previewSingleName)" x-ref="avatarfld" class="form-control" :class="{'is-invalid': update.state.errors.avatar}" type="file" />
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
                        <small x-show="update.state.errors.avatar" x-text="update.state.errors.avatar" class="invalid-feedback"></small>
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
                        <small x-effect="() => checkMultipleFileUploadError('tour', $refs.tourfld, update.state.errors)" class="invalid-feedback">
                            <template x-if="fileErrors.tour && fileErrors.tour.length > 0">
                                <ul>
                                    <template x-for="(err, index) in fileErrors.tour" :key="index">
                                        <li x-text="err"></li>
                                    </template>
                                </ul>
                            </template>
                        </small>
                    </div>
                    <button class="btn btn-sm btn-primary mt-2" :disabled="update.state.processing" type="submit">Save</button>
                    <button x-show="update.state.processing" @click.prevent="update.cancel()" class="btn btn-sm btn-secondary mt-2" type="button">Cancel</button>
                    <button @click.prevent="update.resetStates()" class="btn btn-sm btn-secondary mt-2" type="button">Reset States</button>
                    <button @click.prevent="update.resetState('statusCode')" class="btn btn-sm btn-secondary mt-2" type="button">Reset Status Code</button>
                    {{-- multiple state can be reset by passing array of state names --}}
                </form>
            </div>
        </div>
    </x-ui.card>

    <x-ui.card>
        <x-slot name="title">
            <h5>Destructure to a state <code class="small">x-data="{foo:'bar', ...{ _m: @@aqua} }"</code></h5>
        </x-slot>

        <button x-data="{foo:'bar', ...{ _m: @aqua} }" type="button" x-on:click="_m.delete({name: 'rav'}, 'DELETE')">EXEC -> _m.delete({name: 'rav'}, 'DELETE')</button>
    </x-ui.card>

    <x-ui.card title="On Load Fetch">
        <div x-data="{res: {}, ...{ _m: @aqua} }" x-init="res = await _m.delete({name: 'rav'})">
            <small x-text="JSON.stringify(res)">Res</small>
        </div>
    </x-ui.card>

    <x-ui.card title="On Load Fetch with loading & disabled btn">
        <div x-data="{loading: false, res: {}, ...{ _m: @aqua} }" x-init="loading = true; _m.delete({name: 'rav'}).then((d) => {res = d; loading = false;})">
            <div>
                <small x-show="loading">Loading . . .</small>
                <small x-show="! loading && res" x-text="JSON.stringify(res)"></small>
            </div>
        </div>
    </x-ui.card>

    <script>
        function query({data}) {
            const _ntwrk = @aqua;

            // using reference
            _ntwrk.delete(data)
                .then(res => console.log('success', res));

            // call directly
            // @aqua
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
