@extends('welcome')

@section('content')
{{-- @aquaLink(['App.Http.Controllers.Profile', ['comment' => 'sourav']]) --}}
{{-- @aquaLink('App.Http.Controllers.Profile') --}}

<div class="justify-content-center mt-5 mx-5">
    <div class="container">
        <div class="row">
            <button x-data="{foo:'bar', ...{ _m: @aqua} }" type="button" x-on:click="_m.store({name: 'rav'}, 'get')">Click</button>
            <button x-data="{foo:'bar', ...{ _m: @aqua} }" type="button" x-on:click="_m.store({name: 'rav'}, 'get')">Click</button>
            <button x-data="{foo:'bar', ...{ _m: @aqua} }" type="button" x-on:click="_m.store({name: 'rav'}, 'get')">Click</button>
            <button x-data="{foo:'bar', ...{ _m: @aqua} }" type="button" x-on:click="_m.deleted({name: 'rav'}, 'get')">Click</button>
        </div>
    </div>

</div>
@endsection
