'use client';

import { Grid, GridShowcase } from '@lobehub/ui';
import Image from 'next/image';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { ProductList } from '@/server/services/discover';

import Card from './Card';

interface FeaturedProps {
  items?: ProductList['data'];
  mobile?: boolean;
}

export const FeaturedProduct = memo(({ mobile, items = [] }: FeaturedProps) => {
  return (
    <Flexbox gap={24} horizontal width={'100%'}>
      <GridShowcase
        innerProps={{ gap: 24 }}
        style={{ maxHeight: 'calc(100% - 104px)', maxWidth: 1024, minHeight: 162 }}
        width={'100%'}
      >
        <Grid maxItemWidth={280} rows={4}>
          {items.map((item, index) => (
            <Card key={item.product?.identifier ?? index} showCategory {...item} />
          ))}
        </Grid>
      </GridShowcase>
      {!mobile && (
        <Flexbox align="end" flex={1} height={'100%'} style={{ position: 'relative' }}>
          <Image
            alt={'new-arrive-figure'}
            className="object-cover rounded-sm"
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
            src="/images/figure.svg"
          />
          <Image
            alt={'new-arrive-text'}
            className="object-cover rounded-sm"
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
            src="/images/new_arrive.svg"
          />
        </Flexbox>
      )}
    </Flexbox>
  );
});
