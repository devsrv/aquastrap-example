@extends('welcome')

@section('content')
{{-- @aquaLink('App.View.Components.Post') --}}

<div class="justify-content-center mt-5 mx-5">
    <div class="container">
        <div class="row">
            <button x-data="{foo:'bar', ...{ _m: @aqua} }" type="button" x-on:click="_m.update({name: 'rav'}, 'get')">Click</button>
        </div>
    </div>

</div>
@endsection
