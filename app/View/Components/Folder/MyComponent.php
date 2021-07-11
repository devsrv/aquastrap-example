<?php

namespace App\View\Components\Folder;

use Illuminate\View\Component;
use Devsrv\Aquastrap\Traits\ExposeMethods;
use Illuminate\Routing\Router;

class MyComponent extends Component
{
    use ExposeMethods;

    // public const SKIP_ROUTES = ['delete'];
    public const SKIP_ROUTES = [];

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct()
    {

    }

    public function delete()
    {
        // sleep(5);
        return response()->json(['foo' => 'bar']);
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.folder.my-component');
    }
}
