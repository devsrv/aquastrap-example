<div>
    {{-- <script>
        // @aquaconfig($drips).onSuccess((res) => console.info('successful', res)).onError((err) => console.warn('something went wrong', err));
        @aquaglobal().onSuccess((res) => console.info('successful', res)).onError((err) => console.warn('something went wrong', err));
    </script> --}}


    <script>
        const {_r, _m } = @aqua($drips);

        // const {_r, _m } = @aqua($drips).on({
        //     'success': (res) => console.info('successfully done', res),
        //     'error': (err) => console.warn('went wrong', err),
        // });

        console.log(_r, _m);
    </script>

    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. </p>
    <button type="button" onclick="_m.delete({name: 'rav'}).then(res => console.log(res))">Direct</button>
</div>
