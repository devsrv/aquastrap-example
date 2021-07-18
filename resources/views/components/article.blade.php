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
            <div x-data="{...singleUpload(), form:{email: '', profile: null, avatar: null}, ...@aqua($drips).hook }">
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
                        <input x-on:change="previewSingleFile($el.files[0], $refs.previewSingle); form.avatar = $el.files[0]" class="form-control" :class="{'is-invalid': update.errors.avatar}" type="file" />
                        <img x-ref="previewSingle" class="rounded mt-1" width="80" />
                        <small x-show="update.errors.avatar" x-text="update.errors.avatar" class="invalid-feedback"></small>
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
                previewSingleFile(file, target) {
                    if(!file) { target.setAttribute('src', ''); return; }

                    URL.revokeObjectURL(target.src);

                    target.src = URL.createObjectURL(file);
                    target.onload = () => URL.revokeObjectURL(target.src);
                }
            }))
        })
    </script>
</div>
