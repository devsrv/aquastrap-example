<?php

namespace App\View\Components\Folder;

use Illuminate\Http\Request;
use Illuminate\Routing\Router;
use Illuminate\View\Component;
use Illuminate\Support\Facades\Gate;
use Devsrv\Aquastrap\Traits\AquaSync;

class MyComponent extends Component
{
    use AquaSync;

    // protected static $middlewares = ['auth'];

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct(public $username = 'foo', public $aCallableArg = null)
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
