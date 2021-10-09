<div x-data="{ ...savegame(@aqua.hook.store), ...downloadFile(@aqua.hook.download) }" class="d-flex">
    <select x-model="game" :disabled="hook.state.processing" class="form-control mr-2">
        <option value="COD">COD</option>
        <option value="APEX">APEX</option>
        <option value="Rogue">Rogue</option>
    </select>

    <button :disabled="hook.state.processing" x-on:click.prevent="hook.post({game: game})" type="button" class="btn btn-info btn-sm">Save</button>

    <button x-on:click.prevent="downloadhook.submit({})" :disabled="downloadhook.state.processing" type="button" class="btn btn-sm">download</button>
</div>

@push('scripts')
@once
    <script>
        @aquaConfig.onSuccess((res) => console.info('local successful from config', res))
        .onError((err) => console.warn('local something went wrong', err))
        .onNotification((notify) => console.info('Local Notification', notify));

        document.addEventListener('alpine:init', () => {
            Alpine.data('savegame', (hook) => ({
                game: '',
                hook: hook
            }));

            Alpine.data('downloadFile', (hook) => ({
                downloadhook: hook
            }));
        });
    </script>
@endonce
@endpush
