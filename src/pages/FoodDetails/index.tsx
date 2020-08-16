import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  thumbnail_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const { data } = await api.get(`/foods/${routeParams.id}`);

      const newFood = data.extras.map((data: Extra) => {
        return {
          id: data.id,
          name: data.name,
          value: data.value,
          quantity: data.quantity ? data.quantity : 0,
        };
      });

      setFood(data);
      setExtras(newFood);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    const newData = extras.map((data: Extra) => {
      if (data.id === id) {
        return {
          id: data.id,
          name: data.name,
          value: data.value,
          quantity: data.quantity + 1,
        };
      }

      return data;
    });

    setExtras(newData);
  }

  function handleDecrementExtra(id: number): void {
    const newData = extras.map((data: Extra) => {
      if (data.quantity <= 0) {
        return {
          ...data,
          quantity: 0,
        };
      }
      if (data.id === id) {
        return {
          id: data.id,
          name: data.name,
          value: data.value,
          quantity: data.quantity - 1,
        };
      }

      return data;
    });

    setExtras(newData);
  }

  function handleIncrementFood(): void {
    setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    if (foodQuantity <= 1) {
      return;
    }
    setFoodQuantity(foodQuantity - 1);
  }

  const toggleFavorite = useCallback(async () => {
    setIsFavorite(!isFavorite);

    const {
      id,
      name,
      description,
      price,
      image_url,
      formattedPrice,
      thumbnail_url,
    } = food;

    if (!isFavorite) {
      await api.post(`/favorites`, {
        id,
        name,
        description,
        price,
        image_url,
        formattedPrice,
        thumbnail_url,
      });
      return;
    }

    await api.delete(`/favorites/${id}`);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const totalExtra = extras.reduce((acc, cur) => {
      acc += cur.value * cur.quantity;

      return acc;
    }, 0);

    const totalFood = food.price * foodQuantity;

    const total = totalExtra + totalFood;

    const formattedTotal = formatValue(total);

    return formattedTotal;
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const {
      id,
      name,
      description,
      thumbnail_url,
      image_url,
      extras,
      price,
    } = food;

    await api.post('/orders', {
      id,
      name,
      description,
      price,
      thumbnail_url,
      image_url,
      extras,
    });
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
