import shakaAssets from './asset';
import ShakaDemoAssetInfo from './assets';

const ShakaAssetInfo = new ShakaDemoAssetInfo(
	/* name= */ '',
	/* iconUri= */ '',
	/* manifestUri= */ '',
	/* source= */ shakaAssets.Source.CUSTOM
);

// console.log(ShakaAssetInfo);

export { ShakaAssetInfo };
