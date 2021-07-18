@props(['title' => 'Example', 'slot'])

<div class="card mb-3 shadow-sm p-2">
    <div class="card-title">
        {!! $title !!}
    </div>
    <div class="card-body">
        {{ $slot }}
    </div>
</div>
