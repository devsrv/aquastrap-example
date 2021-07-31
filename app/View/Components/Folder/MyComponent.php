<?php

namespace App\View\Components\Folder;

use Illuminate\Http\Request;
use Illuminate\Routing\Router;
use Illuminate\View\Component;
use Illuminate\Support\Facades\Gate;
use Devsrv\Aquastrap\Traits\ExposeMethods;

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
    public function __construct($username = 'foo', $age = 10)
    {

    }

    public function delete(Request $request)
    {
        // sleep(5);
        return response()->json(['foo' => 'sourav']);
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
