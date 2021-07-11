<div>
    <script>
        // directive - config for the current component
        {{-- @aquaconfig($drips).onSuccess((res) => console.info('successful from config', res)).onError((err) => console.warn('something went wrong', err)); --}}

        // js helper - config for the current component
        // Aquastrap.component('article').onSuccess((res) => console.info('successful from helper config', res)).onError((err) => console.warn('something went wrong', err));

        // js helper - global config
        {{-- Aquastrap.onSuccess((res) => console.info('successful', res)).onError((err) => console.warn('something went wrong', err)); --}}
    </script>

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

    <h2>Article Component </h2>

    <button type="button" onclick="query({name: 'rav'})">Using Local Function</button>
    <button type="button" onclick="@aqua($drips).delete({name: 'rav'})">Direct Call</button>

    <h4>Alpine Examples</h4>
    <button x-data="{foo:'bar', ...{ _m: @aqua($drips)} }" type="button" x-on:click="_m.delete({name: 'rav'})">Request</button>

    <button x-data type="button" x-on:click="Aquastrap.component('article').delete({name: 'rav'})">Global Helper</button>

    <div x-data="{routes: {}}">
        <button type="button" x-on:click="routes = Aquastrap.component('article').routes">Routes Using Global Helper</button>
        <p x-text="JSON.stringify(routes)"></p>
    </div>

    <div x-data="{res: {}, ...{ _m: @aqua($drips)} }" x-init="res = await _m.delete({name: 'rav'})">
        On Load Fetch

        <p x-text="JSON.stringify(res)">Res</p>
    </div>

    <div x-data="{loading: false, res: {}, ...{ _m: @aqua($drips)} }" x-init="loading = true; _m.delete({name: 'rav'}).then((d) => {res = d; loading = false;})">
        On Load Fetch with loading & disabled btn

        <div>
            <p x-show="loading">Loading . . .</p>
            <p x-show="! loading && res" x-text="JSON.stringify(res)"></p>
        </div>
    </div>
</div>
