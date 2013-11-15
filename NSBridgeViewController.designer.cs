using MonoTouch.Foundation;

namespace NSBridgeExamples
{
    [Register ("NSBridgeViewController")]
    partial class NSBridgeViewController
	{
		[Outlet]
		MonoTouch.UIKit.UIWebView webView { get; set; }
		
	}
}
