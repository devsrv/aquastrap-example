<?php

namespace App\View\Components\Folder;

use Illuminate\Http\Request;
use Illuminate\Routing\Router;
use Illuminate\View\Component;
use Illuminate\Support\Facades\Gate;
use Aqua\Aquastrap\Traits\AquaSync;

class MyComponent extends Component
{
    use AquaSync;

    public $username;
    public $aCallableArg;
    public static $fname;

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct($fname, $username = 'foo', $aCallableArg = null)
    {
        $this->username = $username;
        $this->aCallableArg = $aCallableArg;
        self::$fname = $fname;
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
        return view('components.folder.my-component', $this->aquaRecipes());
        // return view('components.folder.my-component')->with($this->aquaRecipes());
    }
}
