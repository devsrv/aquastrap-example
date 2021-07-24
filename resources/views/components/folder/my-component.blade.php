<h1>Nested Folder</h1>

<button x-data="{foo:'bar', ...{ _m: @aqua} }" type="button" x-on:click="_m.delete({name: 'rav'})">Click</button>
<button x-data type="button" x-on:click="Aquastrap.component('folder.my-component').delete({name: 'rav'})">Click Global Helper</button>

